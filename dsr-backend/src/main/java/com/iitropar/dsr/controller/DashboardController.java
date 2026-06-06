package com.iitropar.dsr.controller;
import com.iitropar.dsr.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    @Autowired DashboardService service;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(service.getStats());
    }
}
