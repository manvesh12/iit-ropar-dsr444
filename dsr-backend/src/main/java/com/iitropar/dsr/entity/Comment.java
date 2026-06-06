package com.iitropar.dsr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Comment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(columnDefinition="TEXT")
    private String commentText;
    
    @ManyToOne
    @JoinColumn(name = "section_id")
    private Section section;
    
    @ManyToOne
    @JoinColumn(name = "author_id")
    private User author;
    
    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
