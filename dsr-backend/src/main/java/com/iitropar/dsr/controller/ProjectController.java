package com.iitropar.dsr.controller;
import com.iitropar.dsr.entity.Project;
import com.iitropar.dsr.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    @Autowired ProjectService service;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Project p) {
        Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof com.iitropar.dsr.security.UserDetailsImpl) {
            p.setCreatedBy(((com.iitropar.dsr.security.UserDetailsImpl) principal).getId());
        }
        return ResponseEntity.ok(service.createProject(p));
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}/state")
    public ResponseEntity<?> updateState(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        String state = payload.get("state");
        return ResponseEntity.ok(service.updateProjectState(id, state));
    }
}
