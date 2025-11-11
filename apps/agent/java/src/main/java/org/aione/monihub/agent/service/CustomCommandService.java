package org.aione.monihub.agent.service;

import org.aione.monihub.agent.model.CommandType;
import org.springframework.stereotype.Service;

@Service
public class CustomCommandService {

    public boolean process(CommandType command) {
        switch (command) {
            case Shutdown:
                return shutdown();
            case DisableHttp:
                return disableHttp();
            default:
                throw new IllegalArgumentException("Invalid command: " + command);
        }
    }

    public boolean shutdown() {

        return true;
    }

    public boolean disableHttp() {
        System.out.println("DisableHttp");
        return true;
    }

}
