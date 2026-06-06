package com.iitropar.dsr.controller;

import com.iitropar.dsr.entity.Comment;
import com.iitropar.dsr.entity.Section;
import com.iitropar.dsr.entity.SectionStatus;
import com.iitropar.dsr.entity.User;
import com.iitropar.dsr.repository.UserRepository;
import com.iitropar.dsr.service.SectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sections")
public class SectionController {

    @Autowired
    private SectionService sectionService;
    
    @Autowired
    private UserRepository userRepository;

    @PutMapping("/{id}/status")
    public ResponseEntity<Section> updateStatus(@PathVariable Long id, @RequestParam SectionStatus status, @RequestParam Long actorId, @RequestParam(required = false, defaultValue = "false") boolean ignoreWarning) {
        User actor = userRepository.findById(actorId).orElseThrow(() -> new RuntimeException("Actor not found"));
        return ResponseEntity.ok(sectionService.updateStatus(id, status, actor, ignoreWarning));
    }

    @PostMapping("/{id}/draft")
    public ResponseEntity<Section> saveDraft(@PathVariable Long id, @RequestBody String content, @RequestParam Long actorId, @RequestParam(required = false, defaultValue = "false") boolean ignoreWarning) {
        User actor = userRepository.findById(actorId).orElseThrow(() -> new RuntimeException("Actor not found"));
        return ResponseEntity.ok(sectionService.saveDraft(id, content, actor, ignoreWarning));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<Comment> addComment(@PathVariable Long id, @RequestBody String text, @RequestParam Long reviewerId) {
        User reviewer = userRepository.findById(reviewerId).orElseThrow(() -> new RuntimeException("Reviewer not found"));
        return ResponseEntity.ok(sectionService.addComment(id, text, reviewer));
    }
}
