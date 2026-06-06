package com.iitropar.dsr.controller;
import com.iitropar.dsr.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class DocumentController {
    @Autowired DocumentService service;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(service.uploadFile(file));
    }
}
