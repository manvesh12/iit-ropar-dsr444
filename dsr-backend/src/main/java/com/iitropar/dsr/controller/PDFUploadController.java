package com.iitropar.dsr.controller;

import com.iitropar.dsr.entity.Project;
import com.iitropar.dsr.repository.ProjectRepository;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.GetObjectArgs;
import io.minio.RemoveObjectArgs;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.InputStreamResource;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PDFUploadController {

    @Autowired
    private MinioClient minioClient;

    @Autowired
    private ProjectRepository projectRepository;

    @Value("${minio.bucketName}")
    private String bucketName;

    @PostMapping("/upload-pdf")
    public ResponseEntity<?> uploadPDF(@RequestBody UploadRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String objectName = request.getAnnexureId() + "-" + request.getProjectId() + ".pdf";
            
            if (request.getPdf() == null || request.getPdf().trim().isEmpty()) {
                // Delete file
                minioClient.removeObject(
                    RemoveObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
                );
            } else {
                // Upload file
                byte[] pdfBytes = Base64.getDecoder().decode(request.getPdf());
                ByteArrayInputStream bais = new ByteArrayInputStream(pdfBytes);
                minioClient.putObject(
                    PutObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .stream(bais, pdfBytes.length, -1)
                        .contentType("application/pdf")
                        .build()
                );
            }
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/download-pdf")
    public ResponseEntity<?> downloadPDF(
            @RequestParam Long projectId,
            @RequestParam String annexureId,
            @RequestParam(required = false, defaultValue = "false") boolean inline) {
        try {
            String objectName = annexureId + "-" + projectId + ".pdf";
            InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build()
            );

            // Fetch the original filename from projectState
            String fileName = annexureId + ".pdf";
            Project project = projectRepository.findById(projectId).orElse(null);
            if (project != null && project.getProjectState() != null) {
                try {
                    com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(project.getProjectState());
                    String nameField = annexureId + "PdfName";
                    if (node.has(nameField)) {
                        fileName = node.get(nameField).asText();
                    }
                } catch (Exception e) {
                    // Ignore parsing error, fall back to default filename
                }
            }

            String contentDisposition = inline ? "inline" : "attachment; filename=\"" + fileName + "\"";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(new InputStreamResource(stream));
        } catch (Exception e) {
            return ResponseEntity.status(404).body("PDF not found or error loading: " + e.getMessage());
        }
    }

    public static class UploadRequest {
        private Long projectId;
        private String fileName;
        private String pdf;
        private String annexureId;

        public Long getProjectId() { return projectId; }
        public void setProjectId(Long projectId) { this.projectId = projectId; }

        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }

        public String getPdf() { return pdf; }
        public void setPdf(String pdf) { this.pdf = pdf; }

        public String getAnnexureId() { return annexureId; }
        public void setAnnexureId(String annexureId) { this.annexureId = annexureId; }
    }
}
