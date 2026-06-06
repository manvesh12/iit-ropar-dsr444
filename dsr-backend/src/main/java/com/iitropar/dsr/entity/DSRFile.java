package com.iitropar.dsr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DSRFile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String fileName;
    private String fileType;
    private String filePath;
    private String hash;
    
    @ManyToOne
    @JoinColumn(name = "section_id")
    private Section section;
    
    @ManyToOne
    @JoinColumn(name = "uploader_id")
    private User uploader;
    
    private LocalDateTime uploadedAt;

    @PrePersist protected void onCreate() { uploadedAt = LocalDateTime.now(); }
}
