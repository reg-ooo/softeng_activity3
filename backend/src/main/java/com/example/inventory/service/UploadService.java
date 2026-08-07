package com.example.inventory.service;

import org.springframework.web.multipart.MultipartFile;

public interface UploadService {
    String saveImage(MultipartFile file);
    void deleteImage(String imagePath);
}
