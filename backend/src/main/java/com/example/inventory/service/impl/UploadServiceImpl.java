package com.example.inventory.service.impl;

import com.example.inventory.config.UploadProperties;
import com.example.inventory.service.UploadService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class UploadServiceImpl implements UploadService {
    private final UploadProperties uploadProperties;

    public UploadServiceImpl(UploadProperties uploadProperties) {
        this.uploadProperties = uploadProperties;
    }

    @Override
    public String saveImage(MultipartFile file) {
        validateImage(file);
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

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Image file is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(BAD_REQUEST, "Uploaded file must be an image");
        }

        try (InputStream inputStream = file.getInputStream()) {
            if (ImageIO.read(inputStream) == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Uploaded file is not a valid image");
            }
        } catch (Exception e) {
            throw new ResponseStatusException(BAD_REQUEST, "Uploaded file is not a valid image");
        }
    }
    @Override
    public void deleteImage(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return;
        }

        Path uploadDirectory = uploadProperties.dir().toAbsolutePath().normalize();
        Path filePath = uploadDirectory.resolve(fileName).normalize();

        if (!filePath.startsWith(uploadDirectory)) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid file name");
        }

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not delete file: " + filePath, e);
        }
    }
}
