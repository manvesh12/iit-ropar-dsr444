package com.iitropar.dsr.repository;

import com.iitropar.dsr.entity.Subsection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubsectionRepository extends JpaRepository<Subsection, Long> {
}
