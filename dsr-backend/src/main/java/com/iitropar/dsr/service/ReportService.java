package com.iitropar.dsr.service;

import com.iitropar.dsr.dto.WorkflowRequest;
import com.iitropar.dsr.entity.Project;
import com.iitropar.dsr.entity.Report;
import com.iitropar.dsr.entity.ReportStatus;
import com.iitropar.dsr.entity.Role;
import com.iitropar.dsr.entity.User;
import com.iitropar.dsr.entity.WorkflowHistory;
import com.iitropar.dsr.repository.ReportRepository;
import com.iitropar.dsr.repository.ProjectRepository;
import com.iitropar.dsr.repository.WorkflowHistoryRepository;
import com.iitropar.dsr.exception.UnchangedContentWarningException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import com.iitropar.dsr.dto.AuditLogDTO;

@Service
public class ReportService {
    @Autowired private ReportRepository reportRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private WorkflowHistoryRepository historyRepository;
    @Autowired private com.iitropar.dsr.repository.UserRepository userRepository;

    public Report createReport(Report report, Long creatorId) {
        report.setStatus(ReportStatus.DRAFT);
        report.setSubmittedBy(creatorId);
        return reportRepository.save(report);
    }
    
    public List<Report> getAllReports() { return reportRepository.findAll(); }
    
    public Report getReport(Long projectId) {
        return reportRepository.findByProjectId(projectId).orElseGet(() -> {
            Report r = new Report();
            r.setProjectId(projectId);
            r.setStatus(ReportStatus.DRAFT);
            r.setReportNumber("REP-" + projectId + "-" + System.currentTimeMillis());
            return reportRepository.save(r);
        });
    }
    
    public List<WorkflowHistory> getHistory(Long projectId) {
        Report report = getReport(projectId);
        return historyRepository.findByReportIdOrderByPerformedAtDesc(report.getId());
    }

    public List<AuditLogDTO> getAllHistoryLogs() {
        List<WorkflowHistory> histories = historyRepository.findAll(Sort.by(Sort.Direction.DESC, "performedAt"));
        return histories.stream().map(h -> {
            Report r = reportRepository.findById(h.getReportId()).orElse(null);
            Project p = (r != null && r.getProjectId() != null) ? projectRepository.findById(r.getProjectId()).orElse(null) : null;
            User u = userRepository.findById(h.getPerformedBy()).orElse(null);
            return AuditLogDTO.builder()
                .historyId(h.getId())
                .projectId(p != null ? p.getId() : null)
                .projectName(p != null ? p.getProjectName() : "Unknown Project")
                .action(h.getAction())
                .remarks(h.getRemarks())
                .performedBy(u != null ? u.getFullName() : "Unknown User")
                .performedAt(h.getPerformedAt() != null ? h.getPerformedAt().toString() : "")
                .build();
        }).collect(Collectors.toList());
    }
    
    public Report updateReportStatus(Long projectId, ReportStatus status) {
        Report report = getReport(projectId);
        report.setStatus(status);
        return reportRepository.save(report);
    }

    public Report processWorkflowAction(Long projectId, WorkflowRequest request, Long userId) {
        Report report = getReport(projectId);
        User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        String action = request.getAction().toUpperCase();
        
        // Handle Reject / Return (can be done by anyone at any stage except DRAFT)
        if (action.equals("REJECT") || action.equals("RETURN")) {
            report.setStatus(action.equals("REJECT") ? ReportStatus.REJECTED : ReportStatus.RETURNED);
            saveHistory(report.getId(), action, request.getRemarks(), currentUser.getId());
            
            if (action.equals("RETURN")) {
                Project project = projectRepository.findById(report.getProjectId()).orElse(null);
                if (project != null) {
                    project.setLastReviewedState(project.getProjectState());
                    projectRepository.save(project);
                }
            }
            
            return reportRepository.save(report);
        }

        if (action.equals("FORWARD") || action.equals("APPROVE") || action.equals("SUBMIT")) {
            ReportStatus currentStatus = report.getStatus();
            Role userRole = currentUser.getRole();

            // 1. DATA_ENTRY or OFFICER -> REVIEWER
            if ((currentStatus == ReportStatus.DRAFT || currentStatus == ReportStatus.RETURNED) && (userRole == Role.DATA_ENTRY || userRole == Role.OFFICER)) {
                if (action.equals("SUBMIT") && currentStatus == ReportStatus.RETURNED) {
                    Project project = projectRepository.findById(report.getProjectId()).orElse(null);
                    if (project != null && project.getProjectState() != null && project.getProjectState().equals(project.getLastReviewedState())) {
                        if (!request.isIgnoreWarning()) {
                            throw new UnchangedContentWarningException("You are submitting the same data. Do you want to proceed?");
                        } else {
                            saveHistory(report.getId(), "WARNING_IGNORED", "Submitted same content without addressing review", currentUser.getId());
                        }
                    }
                }
                report.setStatus(ReportStatus.PENDING_REVIEWER);
                if (report.getSubmittedBy() == null) report.setSubmittedBy(currentUser.getId());
            }
            // 2. REVIEWER -> PENDING_DC
            else if (currentStatus == ReportStatus.PENDING_REVIEWER && userRole == Role.REVIEWER) {
                report.setStatus(ReportStatus.PENDING_DC);
                report.setReviewedBy(currentUser.getId());
            }
            // 3. DISTRICT_OWNER -> STATE_ADMIN
            else if (currentStatus == ReportStatus.PENDING_DC && userRole == Role.DISTRICT_OWNER) {
                report.setStatus(ReportStatus.PENDING_STATE_ADMIN);
            }
            // 4. STATE_ADMIN -> APPROVED
            else if (currentStatus == ReportStatus.PENDING_STATE_ADMIN && userRole == Role.STATE_ADMIN) {
                report.setStatus(ReportStatus.APPROVED);
                report.setApprovedBy(currentUser.getId());
            }
            
            saveHistory(report.getId(), action, request.getRemarks(), currentUser.getId());
            return reportRepository.save(report);
        }

        throw new RuntimeException("Unknown action: " + action);
    }

    private void saveHistory(Long reportId, String action, String remarks, Long userId) {
        WorkflowHistory history = WorkflowHistory.builder()
                .reportId(reportId)
                .action(action)
                .remarks(remarks)
                .performedBy(userId)
                .build();
        historyRepository.save(history);
    }
}
