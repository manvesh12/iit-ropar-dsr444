package com.iitropar.dsr.controller;
import com.iitropar.dsr.dto.WorkflowRequest;
import com.iitropar.dsr.entity.Report;
import com.iitropar.dsr.entity.ReportStatus;
import com.iitropar.dsr.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @Autowired ReportService service;

    private Long getCurrentUserId() {
        Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof com.iitropar.dsr.security.UserDetailsImpl) {
            return ((com.iitropar.dsr.security.UserDetailsImpl) principal).getId();
        }
        throw new RuntimeException("User not authenticated");
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DATA_ENTRY', 'OFFICER')")
    public ResponseEntity<?> createReport(@RequestBody Report report) {
        return ResponseEntity.ok(service.createReport(report, getCurrentUserId()));
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAllReports());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam ReportStatus status) {
        return ResponseEntity.ok(service.updateReportStatus(id, status));
    }

    @PostMapping("/{id}/workflow")
    public ResponseEntity<?> processWorkflow(@PathVariable Long id, @RequestBody WorkflowRequest request) {
        return ResponseEntity.ok(service.processWorkflowAction(id, request, getCurrentUserId()));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(service.getHistory(id));
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('STATE_ADMIN')")
    public ResponseEntity<?> getAllAuditLogs() {
        return ResponseEntity.ok(service.getAllHistoryLogs());
    }
}
