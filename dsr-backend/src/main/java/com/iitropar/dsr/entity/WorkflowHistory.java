package com.iitropar.dsr.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkflowHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long reportId;
    private String action;
    private String remarks;
    private Long performedBy;
    private LocalDateTime performedAt;

    @PrePersist protected void onCreate() { performedAt = LocalDateTime.now(); }
}
