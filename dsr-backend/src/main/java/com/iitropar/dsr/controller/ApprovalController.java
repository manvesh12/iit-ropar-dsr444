package com.iitropar.dsr.controller;

import com.iitropar.dsr.entity.Approval;
import com.iitropar.dsr.entity.Project;
import com.iitropar.dsr.entity.User;
import com.iitropar.dsr.repository.ProjectRepository;
import com.iitropar.dsr.repository.UserRepository;
import com.iitropar.dsr.service.ApprovalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    @Autowired
    private ApprovalService approvalService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/approve/{projectId}")
    public ResponseEntity<Approval> approveProject(@PathVariable Long projectId, @RequestParam Long dcId) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new RuntimeException("Project not found"));
        User dc = userRepository.findById(dcId).orElseThrow(() -> new RuntimeException("DC not found"));
        return ResponseEntity.ok(approvalService.approveProject(project, dc));
    }

    @PostMapping("/reject/{projectId}")
    public ResponseEntity<Approval> rejectProject(@PathVariable Long projectId, @RequestParam Long dcId) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new RuntimeException("Project not found"));
        User dc = userRepository.findById(dcId).orElseThrow(() -> new RuntimeException("DC not found"));
        return ResponseEntity.ok(approvalService.rejectProject(project, dc));
    }
}
