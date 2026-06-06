package com.iitropar.dsr.controller;
import com.iitropar.dsr.dto.LoginRequest;
import com.iitropar.dsr.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.authenticateUser(loginRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody com.iitropar.dsr.dto.SignupRequest signUpRequest) {
        return ResponseEntity.ok(authService.registerUser(signUpRequest));
    }
}
