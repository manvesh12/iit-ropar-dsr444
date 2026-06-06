package com.iitropar.dsr.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String fullName;
    @Column(unique = true) private String username;
    @Column(unique = true) private String email;
    private String password;
    @Enumerated(EnumType.STRING) private Role role;
    private String district;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
