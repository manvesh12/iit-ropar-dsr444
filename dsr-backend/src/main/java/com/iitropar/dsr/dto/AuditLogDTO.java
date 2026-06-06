package com.iitropar.dsr.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class AuditLogDTO {
    private Long historyId;
    private Long projectId;
    private String projectName;
    private String action;
    private String remarks;
    private String performedBy;
    private String performedAt;
}
