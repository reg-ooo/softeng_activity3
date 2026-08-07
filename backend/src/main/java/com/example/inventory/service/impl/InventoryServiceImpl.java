package com.example.inventory.service.impl;

import com.example.inventory.dto.CreateInventoryDTO;
import com.example.inventory.dto.InventoryPayload;
import com.example.inventory.model.Inventory;
import com.example.inventory.repository.InventoryRepository;
import com.example.inventory.service.InventoryService;
import com.example.inventory.service.UploadService;
import main.java.com.example.inventory.dto.UpdateInventoryDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final UploadService uploadService;

    public InventoryServiceImpl(InventoryRepository inventoryRepository, UploadService uploadService) {
        this.inventoryRepository = inventoryRepository;
        this.uploadService = uploadService;
    }

    @Override
    public Inventory create(CreateInventoryDTO data, MultipartFile file) {
        Inventory inventory = new Inventory();

        validatePayload(data);

        if(file != null){
            inventory.setImagePath(saveImage(file));
        }

        inventory.setName(data.getName());
        inventory.setDescription(data.getDescription());
        inventory.setQuantity(data.getQuantity());
        inventory.setPrice(data.getPrice());

        return inventoryRepository.save(inventory);
    }

    @Override
    public List<Inventory> findAll(){
        return inventoryRepository.findAllByIsDeletedFalse();
    }

    @Override
    public Inventory update(Long id, UpdateInventoryDTO data, MultipartFile file){
        Inventory item = inventoryRepository.findByIdAndIsDeletedFalse(id).orElse(null);

        if (item == null) {
            throw new ResponseStatusException(NOT_FOUND, "Request not found");
        }

        validatePayload(data);

        if(data.isDeletedImage()) {
            String imagePath = item.getImagePath();
            item.setImagePath(null);
            uploadService.deleteImage(imagePath);
        }

        else if(shouldChangeImagePath(item, data, file)) {
            String imagePath = item.getImagePath();
            item.setImagePath(saveImage(file));
            uploadService.deleteImage(imagePath);
        }

        item.setName(data.getName());
        item.setDescription(data.getDescription());
        item.setQuantity(data.getQuantity());
        item.setPrice(data.getPrice());

        inventoryRepository.save(item);

        return item;
    }

    private void validatePayload(InventoryPayload data) {
        if(data.getName() == null || data.getName().isEmpty()){
            throw new ResponseStatusException(BAD_REQUEST, "Name of item is required");
        }

        if(data.getDescription() == null || data.getDescription().isEmpty()){
            throw new ResponseStatusException(BAD_REQUEST, "Description of item is required");
        }

        if(data.getQuantity() == null || data.getQuantity() <= 0){
            throw new ResponseStatusException(BAD_REQUEST, "Quantity of item is invalid");
        }
    }

    private String saveImage(MultipartFile file){
        String filePath = uploadService.saveImage(file);

        if (filePath == null || filePath.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to save image");
        }

        return filePath;
    }

    private boolean shouldChangeImagePath(Inventory item, UpdateInventoryDTO data, MultipartFile file){
        if(file == null){
            return false;
        }

        if(item.getImagePath() == null || item.getImagePath().isEmpty()){
            return true;
        }

        if(data.getImagePath() == null || data.getImagePath().isEmpty()){
            return true;
        }

        return !data.getImagePath().equals(item.getImagePath());
    }

}
