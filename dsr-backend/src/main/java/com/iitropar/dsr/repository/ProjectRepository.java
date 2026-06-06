package com.iitropar.dsr.repository;
import com.iitropar.dsr.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCreatedBy(Long createdBy);
}
