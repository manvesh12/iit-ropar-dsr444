package com.iitropar.dsr.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Report {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true) private String reportNumber;
    private Long projectId;
    private String title;
    private String description;
    private String reportType;
    @Enumerated(EnumType.STRING) private ReportStatus status;
    private Long submittedBy;
    private Long reviewedBy;
    private Long approvedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
