package com.iitropar.dsr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String action;
    private String entityType;
    private Long entityId;
    
    @ManyToOne
    @JoinColumn(name = "actor_id")
    private User actor;
    
    private LocalDateTime timestamp;

    @PrePersist protected void onCreate() { timestamp = LocalDateTime.now(); }
}
