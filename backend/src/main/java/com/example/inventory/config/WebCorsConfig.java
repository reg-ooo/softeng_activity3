package com.example.inventory.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import com.example.inventory.config.UploadProperties;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;

@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

    private final String frontendOrigin;
    private final UploadProperties uploadProperties;

    public WebCorsConfig(
            @Value("${frontend.origin}") String frontendOrigin,
            UploadProperties uploadProperties
    ) {
        this.frontendOrigin = frontendOrigin;
        this.uploadProperties = uploadProperties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(frontendOrigin)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(
                        uploadProperties.dir()
                                .toAbsolutePath()
                                .normalize()
                                .toUri()
                                .toString()
                );
    }
}
