package com.iitropar.dsr.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Subsection {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    
    @Column(columnDefinition="TEXT")
    private String content;
    
    @ManyToOne
    @JoinColumn(name = "section_id")
    private Section section;
}
