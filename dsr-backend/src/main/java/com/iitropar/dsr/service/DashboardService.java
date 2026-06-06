package com.iitropar.dsr.service;
import com.iitropar.dsr.dto.DashboardStats;
import com.iitropar.dsr.entity.ReportStatus;
import com.iitropar.dsr.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {
    @Autowired UserRepository userRepo;
    @Autowired ProjectRepository projectRepo;
    @Autowired ReportRepository reportRepo;

    public DashboardStats getStats() {
        DashboardStats stats = new DashboardStats();
        stats.setTotalUsers(userRepo.count());
        stats.setTotalProjects(projectRepo.count());
        stats.setTotalReports(reportRepo.count());
        stats.setDraftReports(reportRepo.countByStatus(ReportStatus.DRAFT));
        stats.setPendingReports(
            reportRepo.countByStatus(ReportStatus.PENDING_REVIEWER) +
            reportRepo.countByStatus(ReportStatus.PENDING_OFFICER) +
            reportRepo.countByStatus(ReportStatus.PENDING_DC) +
            reportRepo.countByStatus(ReportStatus.PENDING_STATE_ADMIN)
        );
        stats.setApprovedReports(reportRepo.countByStatus(ReportStatus.APPROVED));
        stats.setRejectedReports(reportRepo.countByStatus(ReportStatus.REJECTED));
        return stats;
    }
}
