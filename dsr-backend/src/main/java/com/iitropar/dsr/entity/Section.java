package com.iitropar.dsr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Section {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    @Enumerated(EnumType.STRING)
    private SectionStatus status;
    
    @Column(columnDefinition="TEXT")
    private String content;
    
    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;
    
    @ManyToOne
    @JoinColumn(name = "assigned_officer_id")
    private User assignedOfficer;
    
    @ManyToOne
    @JoinColumn(name = "assigned_reviewer_id")
    private User assignedReviewer;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Column(columnDefinition="TEXT")
    private String lastReviewedContent;
    
    private Boolean requiresModification;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
