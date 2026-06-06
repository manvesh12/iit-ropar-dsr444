package com.iitropar.dsr.repository;
import com.iitropar.dsr.entity.WorkflowHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkflowHistoryRepository extends JpaRepository<WorkflowHistory, Long> {
    List<WorkflowHistory> findByReportIdOrderByPerformedAtDesc(Long reportId);
}
