package com.iitropar.dsr.service;
import com.iitropar.dsr.entity.Project;
import com.iitropar.dsr.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProjectService {
    @Autowired private ProjectRepository repository;

    public Project createProject(Project p) { return repository.save(p); }
    public List<Project> getAll() { return repository.findAll(); }
    public List<Project> getAllForUser(Long userId) { return repository.findByCreatedBy(userId); }
    public Project getById(Long id) { return repository.findById(id).orElseThrow(); }
    public Project updateProjectState(Long id, String state) {
        Project p = getById(id);
        p.setProjectState(state);
        return repository.save(p);
    }
}
