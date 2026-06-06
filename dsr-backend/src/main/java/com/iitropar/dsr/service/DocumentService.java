package com.iitropar.dsr.service;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.UUID;

@Service
public class DocumentService {
    @Autowired private MinioClient minioClient;
    @Value("${minio.bucketName}") private String bucketName;

    public String uploadFile(MultipartFile file) throws Exception {
        String filename = UUID.randomUUID().toString() + "-" + file.getOriginalFilename();
        InputStream is = file.getInputStream();
        minioClient.putObject(
            PutObjectArgs.builder().bucket(bucketName).object(filename).stream(
                is, file.getSize(), -1)
                .contentType(file.getContentType())
                .build());
        return filename;
    }
}
