DROP TABLE IF EXISTS Members;
CREATE TABLE Members (MemberID SERIAL PRIMARY KEY,
                      FirstName VARCHAR(255) NOT NULL,
		              LastName VARCHAR(255) NOT NULL,
                      Username VARCHAR(255) NOT NULL UNIQUE,
                      Email VARCHAR(255) NOT NULL UNIQUE,
                      Password VARCHAR(255) NOT NULL,
                      SALT VARCHAR(255),
                      Verification INT DEFAULT 0,
                      Activated INT DEFAULT 0,
                      VerificationHex VARCHAR(255)
);
--Added Activated column, if it's a 1, account
--has clicked email verification link and is good to go

--Added VerificationHex column, this contains the 20
--character hex string as the "token" to verify
--the new registered email

DROP TABLE IF EXISTS Contacts;
CREATE TABLE Contacts(PrimaryKey SERIAL PRIMARY KEY,
                      MemberID_A INT NOT NULL,
                      MemberID_B INT NOT NULL,
                      Verified INT DEFAULT 0,
                      FOREIGN KEY(MemberID_A) REFERENCES Members(MemberID),
                      FOREIGN KEY(MemberID_B) REFERENCES Members(MemberID)
);

DROP TABLE IF EXISTS Chats;
CREATE TABLE Chats (ChatID SERIAL PRIMARY KEY,
                    Name VARCHAR(255),
                    Approved INT DEFAULT 0
);

DROP TABLE IF EXISTS ChatMembers;
CREATE TABLE ChatMembers (ChatID INT NOT NULL,
                          MemberID INT NOT NULL,
                          FOREIGN KEY(MemberID) REFERENCES Members(MemberID),
                          FOREIGN KEY(ChatID) REFERENCES Chats(ChatID)
);

DROP TABLE IF EXISTS Messages;
CREATE TABLE Messages (PrimaryKey SERIAL PRIMARY KEY,
                       ChatID INT,
                       Message VARCHAR(255),
                       MemberID INT,
                       FOREIGN KEY(MemberID) REFERENCES Members(MemberID),
                       FOREIGN KEY(ChatID) REFERENCES Chats(ChatID),
                       TimeStamp TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

DROP TABLE IF EXISTS Locations;
CREATE TABLE Locations (ID SERIAL,
                        MemberID INT NOT NULL,
                        Nickname VARCHAR(255) NOT NULL,
                        Lat DECIMAL,
                        Long DECIMAL,
                        ZIP INT,
                        PRIMARY KEY(MemberID, Nickname),
                        FOREIGN KEY(MemberID) REFERENCES Members(MemberID)
);

DROP TABLE IF EXISTS Demo;
CREATE TABLE Demo (DemoID SERIAL PRIMARY KEY,
                        Text VARCHAR(255)
);


DROP TABLE IF EXISTS Push_Token;
CREATE TABLE Push_Token (KeyID SERIAL PRIMARY KEY,
                        MemberID INT NOT NULL UNIQUE,
                        Token VARCHAR(255),
                        FOREIGN KEY(MemberID) REFERENCES Members(MemberID)
);

DROP TABLE IF EXISTS Notifications;
CREATE TABLE Notifications (NotificationID SERIAL PRIMARY KEY, 
                            ChatID INT,
                            Email_a VARCHAR(255), 
                            Email_b VARCHAR(255) NOT NULL, 
                            NoteType VARCHAR(255) NOT NULL, 
                            FOREIGN KEY(ChatID) REFERENCES Chats(ChatID),
                            FOREIGN KEY(Email_a) REFERENCES Members(Email),
                            FOREIGN KEY(Email_b) REFERENCES Members(Email)
);