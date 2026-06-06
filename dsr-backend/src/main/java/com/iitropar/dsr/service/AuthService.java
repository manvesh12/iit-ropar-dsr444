package com.iitropar.dsr.service;
import com.iitropar.dsr.dto.*;
import com.iitropar.dsr.entity.User;
import com.iitropar.dsr.repository.UserRepository;
import com.iitropar.dsr.security.JwtUtils;
import com.iitropar.dsr.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired AuthenticationManager authenticationManager;
    @Autowired UserRepository userRepository;
    @Autowired JwtUtils jwtUtils;

    @Autowired org.springframework.security.crypto.password.PasswordEncoder encoder;

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return new JwtResponse(jwt, userDetails.getUsername(), userDetails.getAuthorities().iterator().next().getAuthority());
    }

    public MessageResponse registerUser(SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return new MessageResponse("Error: Username is already taken!");
        }
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return new MessageResponse("Error: Email is already in use!");
        }

        User user = User.builder()
                .fullName(signUpRequest.getFullName())
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .role(com.iitropar.dsr.entity.Role.DATA_ENTRY)
                .active(true)
                .build();

        userRepository.save(user);
        return new MessageResponse("User registered successfully!");
    }
}
