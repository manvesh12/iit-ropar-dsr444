package com.iitropar.dsr.dto;
import lombok.Data;
@Data public class DashboardStats {
    private long totalUsers;
    private long totalProjects;
    private long totalReports;
    private long draftReports;
    private long pendingReports;
    private long approvedReports;
    private long rejectedReports;
}
