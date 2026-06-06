package com.iitropar.dsr.repository;

import com.iitropar.dsr.entity.Approval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, Long> {
}
