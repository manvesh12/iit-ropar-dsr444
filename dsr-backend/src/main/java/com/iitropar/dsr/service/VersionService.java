package com.iitropar.dsr.service;

import com.iitropar.dsr.entity.Section;
import com.iitropar.dsr.entity.Version;
import com.iitropar.dsr.repository.VersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VersionService {

    @Autowired
    private VersionRepository versionRepository;

    public Version createVersion(Section section, int versionNumber) {
        Version version = Version.builder()
                .section(section)
                .versionNumber(versionNumber)
                .snapshot(section.getContent())
                .build();
        return versionRepository.save(version);
    }
}
