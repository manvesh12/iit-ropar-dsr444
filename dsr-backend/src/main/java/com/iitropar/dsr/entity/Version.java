package com.iitropar.dsr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Version {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Integer versionNumber;
    
    @Column(columnDefinition="TEXT")
    private String snapshot;
    
    @ManyToOne
    @JoinColumn(name = "section_id")
    private Section section;
    
    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
