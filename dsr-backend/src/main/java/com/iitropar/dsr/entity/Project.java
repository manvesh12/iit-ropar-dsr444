package com.iitropar.dsr.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Project {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true) private String projectCode;
    private String projectName;
    private String district;
    private String description;
    @Enumerated(EnumType.STRING) private ProjectStatus status;
    private Long createdBy;
    @Column(columnDefinition="TEXT") private String projectState;
    @Column(columnDefinition="TEXT") private String lastReviewedState;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
