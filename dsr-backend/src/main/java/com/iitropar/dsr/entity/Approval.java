package com.iitropar.dsr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Approval {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String status;
    
    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;
    
    @ManyToOne
    @JoinColumn(name = "dc_id")
    private User dc;
    
    private LocalDateTime approvedAt;

    @PrePersist protected void onCreate() { approvedAt = LocalDateTime.now(); }
}
