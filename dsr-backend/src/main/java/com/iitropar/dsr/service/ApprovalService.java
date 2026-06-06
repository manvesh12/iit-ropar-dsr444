package com.iitropar.dsr.service;

import com.iitropar.dsr.entity.Approval;
import com.iitropar.dsr.entity.Project;
import com.iitropar.dsr.entity.User;
import com.iitropar.dsr.repository.ApprovalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ApprovalService {

    @Autowired
    private ApprovalRepository approvalRepository;

    public Approval approveProject(Project project, User dc) {
        Approval approval = Approval.builder()
                .status("APPROVED")
                .project(project)
                .dc(dc)
                .build();
        return approvalRepository.save(approval);
    }
    
    public Approval rejectProject(Project project, User dc) {
        Approval approval = Approval.builder()
                .status("REJECTED")
                .project(project)
                .dc(dc)
                .build();
        return approvalRepository.save(approval);
    }
}
