package com.iitropar.dsr.repository;
import com.iitropar.dsr.entity.Report;
import com.iitropar.dsr.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
    long countByStatus(ReportStatus status);
    java.util.Optional<Report> findByProjectId(Long projectId);
}
