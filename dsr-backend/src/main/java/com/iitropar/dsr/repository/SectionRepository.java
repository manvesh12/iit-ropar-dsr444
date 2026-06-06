package com.iitropar.dsr.repository;

import com.iitropar.dsr.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {
}
