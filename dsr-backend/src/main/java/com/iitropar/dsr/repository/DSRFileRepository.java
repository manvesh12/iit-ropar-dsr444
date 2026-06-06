package com.iitropar.dsr.repository;

import com.iitropar.dsr.entity.DSRFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DSRFileRepository extends JpaRepository<DSRFile, Long> {
}
