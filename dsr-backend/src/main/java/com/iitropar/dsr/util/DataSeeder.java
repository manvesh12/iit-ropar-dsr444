package com.iitropar.dsr.util;

import com.iitropar.dsr.entity.Role;
import com.iitropar.dsr.entity.User;
import com.iitropar.dsr.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .fullName("Administrator")
                    .username("admin")
                    .email("admin@dsr.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
        }

        if (!userRepository.existsByUsername("demo@iitropar.ac.in")) {
            User demo = User.builder()
                    .fullName("DSR Coordinator")
                    .username("demo@iitropar.ac.in")
                    .email("demo@iitropar.ac.in")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.OFFICER)
                    .active(true)
                    .build();
            userRepository.save(demo);
        }
        
        if (!userRepository.existsByUsername("dc")) {
            User dc = User.builder()
                    .fullName("District Commissioner (Jalandhar)")
                    .username("dc")
                    .district("Jalandhar")
                    .email("dc@dsr.com")
                    .password(passwordEncoder.encode("dc123"))
                    .role(Role.DISTRICT_OWNER)
                    .active(true)
                    .build();
            userRepository.save(dc);
        }

        if (!userRepository.existsByUsername("officer")) {
            User officer = User.builder()
                    .fullName("Geology Officer")
                    .username("officer")
                    .district("Jalandhar")
                    .email("officer@dsr.com")
                    .password(passwordEncoder.encode("officer123"))
                    .role(Role.OFFICER)
                    .active(true)
                    .build();
            userRepository.save(officer);
        }

        if (!userRepository.existsByUsername("reviewer")) {
            User reviewer = User.builder()
                    .fullName("State Reviewer")
                    .username("reviewer")
                    .email("reviewer@dsr.com")
                    .password(passwordEncoder.encode("reviewer123"))
                    .role(Role.REVIEWER)
                    .active(true)
                    .build();
            userRepository.save(reviewer);
        }

        System.out.println("==========================================");
        System.out.println("Default users created:");
        System.out.println("Admin: admin / admin123");
        System.out.println("DC: dc / dc123");
        System.out.println("Officer: officer / officer123");
        System.out.println("Reviewer: reviewer / reviewer123");
        System.out.println("==========================================");
    }
}
