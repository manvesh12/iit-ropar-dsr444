package com.iitropar.dsr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DsrBackendApplication {

	public static void main(String[] args) {
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("UTC"));
		SpringApplication.run(DsrBackendApplication.class, args);
	}

}
