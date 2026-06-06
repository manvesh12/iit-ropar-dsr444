package com.iitropar.dsr.repository;

import com.iitropar.dsr.entity.Version;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VersionRepository extends JpaRepository<Version, Long> {
}
