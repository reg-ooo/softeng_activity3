package com.example.inventory.config;

import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Location used by future multipart upload services.
 *
 * The default path is relative to the backend process working directory, so
 * starting the application from backend/ stores files in backend/uploads/.
 */
@ConfigurationProperties(prefix = "app.upload")
public record UploadProperties(Path dir) {
}
