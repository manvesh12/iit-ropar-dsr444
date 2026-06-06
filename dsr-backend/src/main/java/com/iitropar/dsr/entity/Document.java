package com.iitropar.dsr.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long reportId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String minioObjectKey;
    private Long uploadedBy;
    private LocalDateTime uploadedAt;

    @PrePersist protected void onCreate() { uploadedAt = LocalDateTime.now(); }
}
