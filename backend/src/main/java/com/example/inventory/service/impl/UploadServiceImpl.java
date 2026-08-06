package com.example.inventory.service.impl;

import com.example.inventory.service.UploadService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.example.inventory.config.UploadProperties;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class UploadServiceImpl implements UploadService {
    private final UploadProperties uploadProperties;

    public UploadServiceImpl(UploadProperties uploadProperties) {
        this.uploadProperties = uploadProperties;
    }

    @Override
    public String saveImage(MultipartFile file) {
        String storedFileName = UUID.randomUUID() + ".jpg";

        Path uploadDirectory = uploadProperties.dir().toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadDirectory);
        } catch (Exception e) {
            System.out.println("Error creating upload directory: " + e.getMessage());
            throw new RuntimeException("Could not create upload directory: " + uploadDirectory, e);
        }

        Path filePath = uploadDirectory.resolve(storedFileName);
        try {
            file.transferTo(filePath);
        } catch (Exception e){
            System.out.println("Error saving file: " + e.getMessage());
            throw new RuntimeException("Could not save file: " + filePath, e);
        }

        return storedFileName;
    }
}
