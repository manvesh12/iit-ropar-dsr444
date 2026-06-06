package com.iitropar.dsr.security;
import com.iitropar.dsr.entity.User;
import com.iitropar.dsr.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found: " + username));
        if(!user.isActive()) throw new RuntimeException("User is deactivated");
        return UserDetailsImpl.build(user);
    }
}
