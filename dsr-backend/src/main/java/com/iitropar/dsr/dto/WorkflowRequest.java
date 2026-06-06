package com.iitropar.dsr.dto;

import lombok.Data;

@Data
public class WorkflowRequest {
    private String action; // e.g., "FORWARD", "APPROVE", "REJECT", "RETURN"
    private String remarks;
    private boolean ignoreWarning;
}
