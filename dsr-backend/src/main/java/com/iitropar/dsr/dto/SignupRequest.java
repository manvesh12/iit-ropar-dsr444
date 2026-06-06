package com.iitropar.dsr.dto;
import lombok.Data;
@Data public class SignupRequest {
    private String fullName;
    private String username;
    private String email;
    private String password;
}
