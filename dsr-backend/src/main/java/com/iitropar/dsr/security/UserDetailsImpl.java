package com.iitropar.dsr.security;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.iitropar.dsr.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

public class UserDetailsImpl implements UserDetails {
    @Getter private Long id;
    private String username;
    private String email;
    @JsonIgnore private String password;
    private Collection<? extends GrantedAuthority> authorities;
    @Getter private String district;

    public UserDetailsImpl(Long id, String username, String email, String password, Collection<? extends GrantedAuthority> authorities, String district) {
        this.id = id; this.username = username; this.email = email; this.password = password; this.authorities = authorities; this.district = district;
    }

    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        return new UserDetailsImpl(user.getId(), user.getUsername(), user.getEmail(), user.getPassword(), authorities, user.getDistrict());
    }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
