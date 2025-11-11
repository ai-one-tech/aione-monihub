package org.aione.monihub.agent.model;

import lombok.Getter;

@Getter
public enum CommandType {

    Shutdown,
    Restart,
    DisableHttp,
    EnableHttp

}