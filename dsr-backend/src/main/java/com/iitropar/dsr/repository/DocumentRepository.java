package com.iitropar.dsr.repository;
import com.iitropar.dsr.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, Long> {}
